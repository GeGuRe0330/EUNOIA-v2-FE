
const MobileHeader = ({ onOpen }) => {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-4xl px-4 pt-3">
                <div className="rounded-2xl bg-surface/90 backdrop-blur shadow-sm border border-white/40 px-4 py-3 flex items-center justify-between">
                    <div className="font-serif text-lg font-bold text-primary-dark">
                        EUNOIA
                    </div>

                    <button
                        type="button"
                        onClick={onOpen}
                        className="rounded-xl transition px-3 py-2 text-base font-semibold"
                        aria-label="메뉴 열기"
                    >
                        ☰
                    </button>
                </div>
            </div>
        </header>
    );
};

export default MobileHeader;
