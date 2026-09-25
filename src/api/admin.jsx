import { api } from "./defultApi";

// PENDING 상태인 유저 리스트 조회
export const getPendingMembers = async () => {
    const res = await api.get(`/admin/members/pending`);
    return res.data.data;
};

// PENDING 유저 승인하기
export const approveMember = async (memberId) => {
    const res = await api.patch(`/admin/members/${memberId}/approve`);
    return res.data.data;
};
