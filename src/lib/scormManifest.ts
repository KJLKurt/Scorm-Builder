import type { Quiz } from '../types/quiz';

export function generateManifest(quiz: Quiz): string {
  const identifier = `quiz_${quiz.id}`;
  const resourceId = `${identifier}_res`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2
    imscp_rootv1p1p2.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2
    adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${escapeXml(quiz.title)}</title>
      <item identifier="item1" identifierref="${resourceId}">
        <title>${escapeXml(quiz.title)}</title>
        <adlcp:masteryscore>${quiz.passingScore}</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${resourceId}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="quiz-runtime.js"/>
      <file href="scorm-wrapper.js"/>
      <file href="quiz-data.json"/>
      <file href="quiz-source.json"/>
      <file href="style.css"/>
    </resource>
  </resources>
</manifest>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
