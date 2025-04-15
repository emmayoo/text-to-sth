import toast from "react-hot-toast";

export const createDefaultImagePrompt = (text: string) =>
  `유아 및 초등학생을 위한 학습 자료에 사용될 삽화를 그려주세요. 대상은 "${text}"이며, 실제 비율에 가깝게, 그림 전체가 잘리지 않도록 캔버스 중앙에 배치하고, 사방에 충분한 여백을 남겨주세요. 배경은 흰색이며, 텍스트는 포함하지 않습니다. 다른 이미지는 포함하지 않고, 대상 하나만 가운데에 배치하세요. 뒷 배경은 없습니다. 대상을 제외하고 다른 그림은 없어요. 그림은 쉽게 이해할 수 있는 단순하고 친근한 느낌이어야 하며, 교육적인 목적에 적합하게 설계되어야 합니다. 색상은 따뜻하고 명확하게 구분되도록 사용해주세요. 전체 모습이 명확히 보이고, 형태가 과장되거나 추상적이지 않도록 해주세요. 스타일은 아동용 교재, 동물 도감, 유아 인포그래픽, 색칠공부 그림 등에 어울리는 깔끔하고 또렷한 삽화여야 합니다. 그림은 512x512 픽셀 크기에 어울리게, 세부적인 요소는 간단하게 표현해주세요.`;

export const createDefaultVideoPrompt = (text: string) =>
  `"${text}"를 영상으로 만들 거예요. 단어의 의미를 시각적으로 명확하게 보여주는 4초 이하의 교육용 짧은 애니메이션 영상을 만들어주세요. 영상은 부드럽고 친근한 스타일이고 단순합니다. 학습용 플래시카드처럼 이해하기 쉬워야 합니다. 배경은 흰색이며, 색상은 생생하고 선명하게 표현해주세요.`;

export const copyText = async (text: string) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Copied using clipboard API");
    } catch (err) {
      console.error("Clipboard API failed", err);
    }
  } else {
    // fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; // to avoid scrolling to bottom
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const success = document.execCommand("copy");
      if (success) {
        toast.success("URL이 복사되었습니다!");
      } else {
        toast.error("URL 복사 실패");
      }
    } catch {
      toast.error("URL 복사 실패");
    }

    document.body.removeChild(textarea);
  }
};
