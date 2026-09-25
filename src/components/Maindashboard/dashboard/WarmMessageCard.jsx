const WarmMessageCard = ({ messages }) => {
    return (
        <div className="bg-surface shadow-md rounded-xl p-4 h-full">
            <h2 className="text-lg font-bold text-textPrimary">
                지금의 감정을 비춰보는 말
            </h2>
            <ul className="mt-1 list-disc list-inside space-y-2 text-textSecondary rounded-2xl bg-white/45 shadow-sm p-2 py-4 md:p-3 border border-primary-dark/25 text-sm">
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </div>
    );
};

export default WarmMessageCard;
