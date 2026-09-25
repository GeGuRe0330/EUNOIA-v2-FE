import { useEffect, useState } from "react";
import axios from "axios";

function formatFileSize(bytes) {
    if (bytes == null || isNaN(bytes)) return "-";

    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
    if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
    if (bytes >= kb) return `${(bytes / kb).toFixed(2)} KB`;
    return `${bytes} B`;
}

function formatDate(timestamp) {
    if (!timestamp) return "-";

    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export default function BackupDownloadPage() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchFiles = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await axios.get("/api/share/backups");

                if (!isMounted) return;

                const sortedFiles = [...res.data].sort(
                    (a, b) => b.modifiedAt - a.modifiedAt
                );

                setFiles(sortedFiles);
            } catch (err) {
                console.error("백업 파일 목록 조회 실패:", err);
                if (!isMounted) return;
                setError("백업 파일 목록을 불러오지 못했습니다.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchFiles();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleDownload = (fileName) => {
        window.location.href = `/api/share/backups/download?name=${encodeURIComponent(fileName)}`;
    };

    return (
        <div className="min-h-screen bg-[#f6f3ee] px-4 py-8 text-[#2f2a24]">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
                    <p className="mb-2 text-sm font-medium text-[#7b6f63]">
                        개구리 서버🐸
                    </p>
                    <h1 className="text-2xl font-bold md:text-3xl">
                        Minecraft 서버파일 백업 다운로드
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-[#5f564d] md:text-base">
                        🚨 백업 특성 상 서버 로그, CoreProtect 플러그인은 포함되지 않습니다. 🚨
                    </p>
                    <p className="mt-2 text-sm leading-6 text-red-600 md:text-base">
                        해당 페이지는 공개 시점 기준 15일 이후 폐쇄될 예정입니다. 필요하신 분은 정해진 기간 내에 다운받길 권장드립니다.
                    </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/80 shadow-sm overflow-hidden">
                    <div className="border-b border-black/10 bg-black/[0.03] px-5 py-4">
                        <h2 className="text-lg font-semibold">백업 파일 목록</h2>
                    </div>

                    {loading && (
                        <div className="px-5 py-10 text-center text-[#6a6258]">
                            백업 파일을 불러오는 중입니다...
                        </div>
                    )}

                    {!loading && error && (
                        <div className="px-5 py-10 text-center text-red-600">
                            {error}
                        </div>
                    )}

                    {!loading && !error && files.length === 0 && (
                        <div className="px-5 py-10 text-center text-[#6a6258]">
                            현재 표시할 백업 파일이 없습니다.
                        </div>
                    )}

                    {!loading && !error && files.length > 0 && (
                        <div className="divide-y divide-black/10">
                            {files.map((file) => (
                                <div
                                    key={file.name}
                                    className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#2f2a24] md:text-base">
                                            {file.name}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6a6258]">
                                            <span>용량: {formatFileSize(file.size)}</span>
                                            <span>수정일: {formatDate(file.modifiedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(file.name)}
                                            className="rounded-xl border border-[#2f2a24]/15 bg-[#2f2a24] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                        >
                                            다운로드
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm leading-6 text-[#5f564d] shadow-sm">
                    <p>· 파일은 최신 수정일 기준으로 위에 표시됩니다.</p>
                    <p>· 다운로드 전 기존 월드 백업을 별도로 보관하는 것을 권장합니다.</p>
                </div>
            </div>
        </div>
    );
}