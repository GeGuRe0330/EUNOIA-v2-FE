import { Link } from "react-router-dom";

const BUTTON_CLASS_NAME = `
    relative inline-flex items-center justify-center
    select-none cursor-pointer
    font-semibold tracking-wide
    px-6 py-4 rounded-xl
    text-textPrimary
    bg-surface
    border-2 border-primary-dark/25

    [transform-style:preserve-3d]
    transition duration-150
    [transition-timing-function:cubic-bezier(0,0,0.58,1)]

    before:content-['']
    before:absolute before:inset-0
    before:rounded-[inherit]
    before:bg-primary/25
    before:ring-2 before:ring-primary-dark/25
    before:shadow-[0_12px_0_0_rgba(0,0,0,0.08)]
    before:[transform:translate3d(0,12px,-16px)]
    before:transition before:duration-150
    before:[transition-timing-function:cubic-bezier(0,0,0.58,1)]

    hover:bg-surface
    hover:[transform:translate(0,4px)]
    hover:before:[transform:translate3d(0,8px,-16px)]
    hover:before:shadow-[0_10px_0_0_rgba(0,0,0,0.07)]

    active:bg-surface
    active:[transform:translate(0,12px)]
    active:before:[transform:translate3d(0,0,-16px)]
    active:before:shadow-[0_0_0_0_rgba(0,0,0,0)]
  `;

// to가 있으면 페이지 이동(Link), onClick만 있으면 같은 디자인의 버튼(button) — 화면 이동이 아닌 동작(분석 시작 등)에도 재사용
const EunoiaPageLinkButton = ({ to, message, onClick }) => {
  if (to) {
    return (
      <Link to={to} aria-label={message} className={BUTTON_CLASS_NAME}>
        {message}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={message} className={BUTTON_CLASS_NAME}>
      {message}
    </button>
  );
};

export default EunoiaPageLinkButton;
