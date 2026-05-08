/* SCORM 1.2 Quiz Runtime
 * Reads QUIZ_DATA global (set inline in index.html) or falls back to fetching quiz-data.json.
 * Depends on scorm-wrapper.js being loaded first.
 */
(function (global) {
  'use strict';

  /* ── State ─────────────────────────────────────────────────────────── */
  var quiz = null;
  var questions = []; // ordered array (may be shuffled)
  var state = {
    selectedAnswers: {},  // questionId → choiceId
    submitted: false,
    score: null,          // 0-100
    passed: null,
  };

  /* ── Shuffle ────────────────────────────────────────────────────────── */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ── SCORM helpers ──────────────────────────────────────────────────── */
  var SCORM = global.ScormWrapper;

  function saveSuspendData() {
    if (!SCORM) return;
    var data = {
      selectedAnswers: state.selectedAnswers,
      submitted: state.submitted,
      score: state.score,
      passed: state.passed,
    };
    SCORM.setValue('cmi.suspend_data', JSON.stringify(data));
    SCORM.commit();
  }

  function loadSuspendData() {
    if (!SCORM) return;
    var raw = SCORM.getValue('cmi.suspend_data');
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      state.selectedAnswers = data.selectedAnswers || {};
      state.submitted = !!data.submitted;
      state.score = data.score != null ? data.score : null;
      state.passed = data.passed != null ? data.passed : null;
    } catch (e) {
      console.warn('[QuizRuntime] Could not parse suspend_data:', e);
    }
  }

  function reportToScorm() {
    if (!SCORM || !SCORM.isAvailable()) return;
    var r = quiz.reporting;

    if (r.reportScore) {
      SCORM.setValue('cmi.core.score.raw', String(Math.round(state.score)));
      SCORM.setValue('cmi.core.score.min', '0');
      SCORM.setValue('cmi.core.score.max', '100');
    }

    // SCORM 1.2 uses a single lesson_status field.
    // Priority: pass/fail > completion > nothing
    if (r.reportPassFail) {
      SCORM.setValue('cmi.core.lesson_status', state.passed ? 'passed' : 'failed');
    } else if (r.reportCompletion) {
      SCORM.setValue('cmi.core.lesson_status', 'completed');
    }

    SCORM.commit();
  }

  /* ── Scoring ────────────────────────────────────────────────────────── */
  function calculateScore() {
    var correct = 0;
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var selected = state.selectedAnswers[q.id];
      if (selected && q.correctChoiceIds.indexOf(selected) !== -1) {
        correct++;
      }
    }
    return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'htmlFor') node.htmlFor = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      if (typeof children === 'string') {
        node.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function (c) { if (c) node.appendChild(c); });
      } else {
        node.appendChild(children);
      }
    }
    return node;
  }

  function renderQuestion(q, idx) {
    var isSubmitted = state.submitted;
    var selectedId = state.selectedAnswers[q.id] || null;
    var isCorrect = selectedId && q.correctChoiceIds.indexOf(selectedId) !== -1;
    var isLocked = isSubmitted && quiz.lockAfterSubmit;

    var blockClass = 'question-block';
    if (isSubmitted) blockClass += isCorrect ? ' correct' : ' incorrect';

    var choices = quiz.shuffleAnswers && !isSubmitted ? shuffle(q.choices) : q.choices;

    var choiceItems = choices.map(function (c) {
      var isSelected = selectedId === c.id;
      var isCorrectChoice = isSubmitted && q.correctChoiceIds.indexOf(c.id) !== -1;
      var isWrongChoice = isSubmitted && isSelected && !isCorrectChoice;

      var liClass = 'choice-item';
      if (isSelected) liClass += ' selected';
      if (isCorrectChoice && isSubmitted) liClass += ' correct-choice';
      if (isWrongChoice) liClass += ' incorrect-choice';
      if (isLocked) liClass += ' locked';

      var radioId = 'q' + idx + '_' + c.id;
      var radio = el('input', {
        type: 'radio',
        name: 'q_' + q.id,
        id: radioId,
        value: c.id,
      });
      if (isSelected) radio.checked = true;
      if (isLocked) radio.disabled = true;

      if (!isLocked) {
        radio.addEventListener('change', function () {
          state.selectedAnswers[q.id] = c.id;
          updateProgress();
          saveSuspendData();
        });
      }

      var label = el('label', { htmlFor: radioId });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(c.text));

      return el('li', { className: liClass }, label);
    });

    var feedbackEl = null;
    if (isSubmitted) {
      var feedbackText = isCorrect ? q.feedbackCorrect : q.feedbackIncorrect;
      if (feedbackText) {
        feedbackEl = el('div', { className: 'feedback ' + (isCorrect ? 'correct' : 'incorrect') }, feedbackText);
      }
    }

    return el('div', { className: blockClass }, [
      el('div', { className: 'question-number' }, 'Question ' + (idx + 1) + ' of ' + questions.length),
      el('div', { className: 'question-prompt' }, q.prompt),
      el('ul', { className: 'choices-list' }, choiceItems),
      feedbackEl,
    ]);
  }

  function updateProgress() {
    var answered = Object.keys(state.selectedAnswers).length;
    var total = questions.length;
    var pct = total > 0 ? (answered / total) * 100 : 0;
    var fill = document.getElementById('progress-fill');
    var statusText = document.getElementById('progress-status');
    if (fill) fill.style.width = pct + '%';
    if (statusText) statusText.textContent = answered + ' of ' + total + ' answered';
  }

  function renderResultBlock() {
    var r = quiz.reporting;
    var title, desc, cls;

    if (state.score === null) return null;

    if (r.reportPassFail) {
      if (state.passed) {
        title = 'Passed!';
        desc = 'Your score: ' + state.score + '% (passing: ' + quiz.passingScore + '%)';
        cls = 'passed';
      } else {
        title = 'Not Passed';
        desc = 'Your score: ' + state.score + '% (passing: ' + quiz.passingScore + '%)';
        cls = 'failed';
      }
    } else {
      title = 'Completed';
      desc = r.reportScore ? 'Your score: ' + state.score + '%' : 'Thank you for completing this quiz.';
      cls = 'completed';
    }

    var block = el('div', { id: 'result-block', className: cls }, [
      el('h2', null, title),
      el('p', null, desc),
    ]);
    return block;
  }

  function render() {
    var body = document.getElementById('quiz-body');
    var footer = document.getElementById('quiz-footer');
    if (!body || !footer) return;

    body.innerHTML = '';
    footer.innerHTML = '';

    // Progress bar (only when not submitted)
    if (!state.submitted) {
      var progressWrap = el('div', { className: 'progress-bar-wrap' }, [
        el('div', { id: 'progress-fill', className: 'progress-bar-fill' }),
      ]);
      var statusText = el('div', { id: 'progress-status', className: 'status-text' }, '0 of 0 answered');
      body.appendChild(progressWrap);
      body.appendChild(statusText);
    }

    // Questions
    questions.forEach(function (q, i) {
      body.appendChild(renderQuestion(q, i));
    });

    // Footer
    if (state.submitted) {
      var result = renderResultBlock();
      if (result) footer.appendChild(result);

      if (quiz.allowRetake) {
        var retakeBtn = el('button', { className: 'btn btn-secondary' }, 'Retake Quiz');
        retakeBtn.addEventListener('click', handleRetake);
        footer.appendChild(retakeBtn);
      }
    } else {
      var submitBtn = el('button', { id: 'submit-btn', className: 'btn btn-primary' }, 'Submit Quiz');
      submitBtn.addEventListener('click', handleSubmit);
      footer.appendChild(submitBtn);
    }

    updateProgress();
  }

  /* ── Actions ────────────────────────────────────────────────────────── */
  function handleSubmit() {
    state.score = calculateScore();
    state.passed = state.score >= quiz.passingScore;
    state.submitted = true;
    saveSuspendData();
    reportToScorm();
    render();
  }

  function handleRetake() {
    state.selectedAnswers = {};
    state.submitted = false;
    state.score = null;
    state.passed = null;
    if (quiz.shuffleQuestions) questions = shuffle(quiz.questions);
    saveSuspendData();
    // Reset lesson status for retake
    if (SCORM && SCORM.isAvailable()) {
      SCORM.setValue('cmi.core.lesson_status', 'incomplete');
      SCORM.commit();
    }
    render();
  }

  /* ── Resume logic ───────────────────────────────────────────────────── */
  function applyResumeMode() {
    var mode = quiz.resumeMode;

    if (mode === 'start_fresh') {
      state.selectedAnswers = {};
      state.submitted = false;
      state.score = null;
      state.passed = null;
    } else if (mode === 'resume_in_progress') {
      // Keep loaded state as-is; if submitted and lockAfterSubmit, stay locked
    } else if (mode === 'show_submitted_answers') {
      // Keep loaded state; submitted state is shown with answers
    }
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */
  function boot(quizObj) {
    quiz = quizObj;
    questions = quiz.shuffleQuestions ? shuffle(quiz.questions.slice()) : quiz.questions;

    // Update header
    var h1 = document.getElementById('quiz-title');
    var desc = document.getElementById('quiz-description');
    if (h1) h1.textContent = quiz.title;
    if (desc) {
      if (quiz.description) {
        desc.textContent = quiz.description;
      } else {
        desc.style.display = 'none';
      }
    }

    // Initialize SCORM
    if (SCORM) {
      SCORM.initialize();
      if (SCORM.isAvailable()) {
        SCORM.setValue('cmi.core.lesson_status', 'incomplete');
      }
      loadSuspendData();
    }

    applyResumeMode();
    render();
  }

  function init() {
    // Try inline data first (set in index.html), then fall back to fetch
    if (global.QUIZ_DATA && global.QUIZ_DATA.quiz) {
      boot(global.QUIZ_DATA.quiz);
      return;
    }

    // Fallback: fetch quiz-data.json
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'quiz-data.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          boot(data.quiz);
        } catch (e) {
          showError('Failed to parse quiz data: ' + e.message);
        }
      } else {
        showError('Could not load quiz data (HTTP ' + xhr.status + ').');
      }
    };
    xhr.onerror = function () {
      showError('Network error loading quiz data.');
    };
    xhr.send();
  }

  function showError(msg) {
    var container = document.getElementById('quiz-container');
    if (container) {
      container.innerHTML = '<div id="error-block"><h2>Error</h2><p>' + msg + '</p></div>';
    }
  }

  /* ── Unload ─────────────────────────────────────────────────────────── */
  window.addEventListener('beforeunload', function () {
    if (SCORM) {
      saveSuspendData();
      SCORM.finish();
    }
  });

  /* ── Start ──────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
