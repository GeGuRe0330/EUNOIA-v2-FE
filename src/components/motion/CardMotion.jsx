import { motion } from "framer-motion";
import { cardVariants } from "../../utils/animations/cardVariants";

const CardMotion = ({ index = 0, className = "", children }) => {
    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default CardMotion;
