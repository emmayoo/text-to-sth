export const createDefaultImagePrompt = (text: string) =>
  `흰색 배경에 "${text}"를 담은 미니멀한 벡터 일러스트레이션입니다. 객체는 중앙에 배치하고 명확하게 그려야 합니다. 텍스트는 사용하지 마세요. 교육적이고 학습자에게 적합하도록 디자인해야 합니다. 스타일은 깔끔하고 단순하며 이해하기 쉬워야 합니다.`;
// `A minimal vector illustration of "${text}" on a white background. The object should be centered and clearly drawn. No text. Make it educational and suitable for learners. The style should be clean, simple, and easy to understand.`;

export const createDefaultVideoPrompt = (text: string) =>
  `"${text}"를 영상으로 만들 거예요. 단어의 의미를 시각적으로 명확하게 보여주는 교육용 짧은 애니메이션 영상을 만들어주세요. 영상은 단순하고 깔끔해야 하며, 하단에 단어가 잘 보이도록 표시해주세요. 학습용 플래시카드처럼 이해하기 쉬워야 합니다. 배경은 흰색이며, 색상은 생생하고 선명하게 표현해주세요.
캐릭터가 등장하는 경우, 자연스럽게 움직이거나 동작을 통해 단어를 표현해야 합니다. 사물이 중심인 경우, 주요 객체는 화면 중앙에 명확하게 배치되어야 하며, 배경 요소는 최소화해주세요.
애니메이션 스타일은 부드럽고 친근한 느낌이어야 하며, 전체 장면은 클로즈업 또는 중간 거리로 구성해주세요. 영상 길이는 5초 이하로 해주세요.`;
