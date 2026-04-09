import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import { getCurrentUser, logout, changePassword, withdraw } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';

export default function MyPageInfoPage() {
  const navigate = useNavigate();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPw, setWithdrawPw] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login');
  }, [navigate]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    enabled: isAuthenticated(),
    staleTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });

  const passwordMutation = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      changePassword(current, next),
    onSuccess: () => {
      alert('비밀번호가 변경되었습니다.');
      setShowPasswordModal(false);
      setCurrentPw(''); setNewPw(''); setNewPwConfirm('');
    },
    onError: (err) => setPwError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (password: string) => withdraw(password),
    onSuccess: () => {
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/');
    },
    onError: (err) => setWithdrawError(err instanceof Error ? err.message : '회원탈퇴에 실패했습니다.'),
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    setPwError(null);
    if (newPw !== newPwConfirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }
    if (newPw.length < 8) { setPwError('비밀번호는 8자 이상이어야 합니다.'); return; }
    passwordMutation.mutate({ current: currentPw, next: newPw });
  };

  return (
    <MypageLayout onLogout={handleLogout}>
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      {!isLoading && (<>
      <div className="bg-white rounded-xl border border-[#D6E0EB] p-4 sm:p-8">
        <h2 className="text-lg sm:text-[22px] font-bold text-[#1E2124] mb-6">회원정보</h2>

        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center gap-4 py-4 border-b border-[#F3F4F6]">
            <span className="w-24 sm:w-28 text-[14px] sm:text-[15px] text-[#6B7280] shrink-0">이름</span>
            <span className="text-[15px] sm:text-[16px] text-[#1E2124]">{user?.name ?? '-'}</span>
          </div>
          <div className="flex flex-row items-center gap-4 py-4 border-b border-[#F3F4F6]">
            <span className="w-24 sm:w-28 text-[14px] sm:text-[15px] text-[#6B7280] shrink-0">이메일</span>
            <span className="text-[15px] sm:text-[16px] text-[#1E2124] break-all">{user?.email ?? '-'}</span>
          </div>
          <div className="flex flex-row items-center gap-4 py-4 border-b border-[#F3F4F6]">
            <span className="w-24 sm:w-28 text-[14px] sm:text-[15px] text-[#6B7280] shrink-0">비밀번호</span>
            <button onClick={() => setShowPasswordModal(true)}
              className="px-3 sm:px-4 py-2 text-[13px] sm:text-[14px] border border-[#256EF4] text-[#256EF4] rounded-lg hover:bg-[#EFF4FF] transition">
              비밀번호 변경
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={() => setShowWithdrawModal(true)}
            className="text-[13px] sm:text-[14px] text-[#9CA3AF] hover:text-red-500 transition underline">
            회원탈퇴
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div onClick={() => setShowPasswordModal(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-[440px] flex flex-col gap-4">
            <h3 className="text-[18px] sm:text-[20px] font-bold text-[#1E2124]">비밀번호 변경</h3>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="현재 비밀번호"
              className="w-full px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-lg text-[16px] outline-none" />
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호"
              className="w-full px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-lg text-[16px] outline-none" />
            <input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} placeholder="새 비밀번호 확인"
              className="w-full px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-lg text-[16px] outline-none" />
            {pwError && <p className="text-red-500 text-[14px]">{pwError}</p>}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-3 border border-[#CDD1D5] rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition">취소</button>
              <button onClick={handleChangePassword} disabled={passwordMutation.isPending}
                className="flex-1 py-3 bg-[#039BE5] text-white rounded-lg disabled:opacity-50 hover:bg-[#0288D1] transition">
                {passwordMutation.isPending ? '변경 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원탈퇴 모달 */}
      {showWithdrawModal && (
        <div onClick={() => setShowWithdrawModal(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-[440px] flex flex-col gap-4">
            <h3 className="text-[18px] sm:text-[20px] font-bold text-[#1E2124]">회원탈퇴</h3>
            <p className="text-[14px] sm:text-[15px] text-[#6B7280]">탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다. 비밀번호를 입력하여 확인해주세요.</p>
            <input type="password" value={withdrawPw} onChange={e => setWithdrawPw(e.target.value)} placeholder="비밀번호"
              className="w-full px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-lg text-[16px] outline-none" />
            {withdrawError && <p className="text-red-500 text-[14px]">{withdrawError}</p>}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 border border-[#CDD1D5] rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition">취소</button>
              <button onClick={() => withdrawMutation.mutate(withdrawPw)} disabled={withdrawMutation.isPending}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg disabled:opacity-50 hover:bg-red-600 transition">
                {withdrawMutation.isPending ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}
    </MypageLayout>
  );
}
