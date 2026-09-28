import { api, unwrap } from "./defaultApi";

// PENDING 상태인 유저 리스트 조회
export const getPendingMembers = async () => {
    const res = await api.get(`/admin/members/pending`);
    return unwrap(res);
};

// PENDING 유저 승인하기 (응답 data는 null)
export const approveMember = async (memberId) => {
    const res = await api.patch(`/admin/members/${memberId}/approve`);
    return unwrap(res);
};
