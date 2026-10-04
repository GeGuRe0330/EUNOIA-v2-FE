import { motion } from "framer-motion";
import { cardVariants } from "../../utils/animations/cardVariants";

// instant: 등장 애니메이션 없이 처음부터 완성된 모습으로 — 이미 스크롤된 위치로 복원되는 화면이 빈 채로 떠오르는 것을 막는다
const CardMotion = ({ index = 0, className = "", instant = false, children }) => {
    return (
        <motion.div
            custom={index}
            initial={instant ? false : "hidden"}
            animate="visible"
            variants={cardVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default CardMotion;
