import { useEffect, useId, useRef, useState } from "react";
import { useRevalidator, useRouteLoaderData } from "react-router-dom";
import CardMotion from "../../components/motion/CardMotion";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import { useApiError } from "../../hooks/useApiError";
import { updateMyProfile, changeMyPassword } from "../../api/EunoiaApi";
import {
    GENDER_OPTIONS,
    PROFILE_COPY,
    NOTICE_DURATION_MS,
    EMPTY_PASSWORD_FORM,
    toProfileForm,
    validateProfile,
    toProfilePayload,
    isProfileChanged,
    validatePasswordChange,
    isPasswordFormFilled,
    toPasswordPayload,
    resolveSaveError,
} from "./profileSettingsView";

const CARD_CLASS =
    "bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20";

const INPUT_CLASS =
    "w-full rounded-lg border border-primary-dark/30 bg-white/60 px-3 py-2 text-sm text-textPrimary shadow-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 " +
    "aria-[invalid=true]:border-red-400 read-only:bg-primary-light/40 read-only:text-textSecondary read-only:shadow-none";

const SAVE_BUTTON_CLASS =
    "rounded-lg border-2 border-primary-dark/40 bg-white/60 px-5 py-2 text-sm font-semibold text-textPrimary shadow-sm " +
    "transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md hover:border-primary-dark/80 " +
    "active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:hover:bg-white/60 disabled:hover:border-primary-dark/40";

const FieldError = ({ id, message }) =>
    message ? (
        <p id={id} className="mt-1 text-xs text-red-600">
            {message}
        </p>
    ) : null;

// 라벨 + 입력칸 + 오류 문구 — 오류는 aria-describedby로 입력칸과 연결
const Field = ({ label, error, children }) => {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="block text-sm mb-1 text-textSecondary">
                {label}
            </label>
            {children({ id, "aria-invalid": error ? "true" : undefined, "aria-describedby": error ? `${id}-error` : undefined })}
            <FieldError id={`${id}-error`} message={error} />
        </div>
    );
};

// 저장 결과 안내 — 잠깐 보이고 사라진다
const useNotice = () => {
    const [notice, setNotice] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const show = (message) => {
        clearTimeout(timerRef.current);
        setNotice(message);
        timerRef.current = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    };
    const hide = () => {
        clearTimeout(timerRef.current);
        setNotice(null);
    };
    return { notice, show, hide };
};

const FormMessages = ({ errorMessage, notice }) => (
    <>
        {errorMessage && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                {errorMessage}
            </div>
        )}
        {/* 알림 영역은 항상 그려 둬야 스크린리더가 나중에 채워지는 문구를 읽는다 */}
        <div role="status" aria-live="polite">
            {notice && (
                <p className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
                    {notice}
                </p>
            )}
        </div>
    </>
);

/* ① 기본 정보 — 아바타, 닉네임, 성별, 나이, 읽기 전용 이메일. 아바타 자리는 ⑨-2(이미지 업로드)에서 [사진 변경]을 얹을 곳 */
const InfoCard = ({ me }) => {
    const { revalidate } = useRevalidator();
    const { handleApiError } = useApiError();
    const { notice, show, hide } = useNotice();

    const [form, setForm] = useState(() => toProfileForm(me));
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    const changed = isProfileChanged(form, me);

    const update = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        setErrorMessage(null);
        hide();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving || !changed) return;

        const errors = validateProfile(form);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        setErrorMessage(null);
        try {
            await updateMyProfile(toProfilePayload(form));
            // 내비게이션 User box와 이 화면의 기준값(me)을 새 값으로 — Layout 로더를 다시 불러온다
            await revalidate();
            setForm((prev) => ({ ...prev, nickname: prev.nickname.trim() }));
            show(PROFILE_COPY.infoSaved);
        } catch (err) {
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }
            const result = resolveSaveError(err, ["nickname", "gender", "age"]);
            setFieldErrors(result.fieldErrors);
            setErrorMessage(result.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className={CARD_CLASS} aria-labelledby="profile-info-title">
            <h2 id="profile-info-title" className="text-lg font-semibold text-textPrimary mb-4">
                {PROFILE_COPY.infoTitle}
            </h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* 넓은 화면은 [아바타 | 닉네임·이메일] 두 칸 그리드, 좁은 화면은 아바타를 가운데 두고 위아래로 쌓음. 아바타 자리는 ⑨-2에서 [사진 변경]을 얹을 곳 */}
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
                    {/* 고른 성별의 기본 이미지를 저장 전에 미리 보여줌. 좁은 화면에서는 가운데 */}
                    <div className="flex justify-center sm:block">
                        <ProfileAvatar gender={form.gender || me?.gender} sizeClass="w-28 h-28 sm:w-40 sm:h-40" />
                    </div>

                    <div className="min-w-0 space-y-4">
                        <Field label="닉네임" error={fieldErrors.nickname}>
                            {(a11y) => (
                                <input
                                    {...a11y}
                                    value={form.nickname}
                                    onChange={(e) => update("nickname", e.target.value)}
                                    autoComplete="nickname"
                                    className={INPUT_CLASS}
                                />
                            )}
                        </Field>

                        <Field label="이메일">
                            {(a11y) => <input {...a11y} value={me?.email ?? ""} readOnly className={INPUT_CLASS} />}
                        </Field>
                    </div>
                </div>

                <div>
                    <p id="profile-gender-label" className="block text-sm mb-1 text-textSecondary">
                        성별
                    </p>
                    <div role="group" aria-labelledby="profile-gender-label" className="flex gap-2">
                        {GENDER_OPTIONS.map((g) => {
                            const selected = form.gender === g.value;
                            return (
                                <button
                                    key={g.value}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => update("gender", g.value)}
                                    className={
                                        "flex-1 rounded-lg border-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 " +
                                        (selected
                                            ? "border-primary-dark bg-primary/60 font-semibold text-textPrimary"
                                            : "border-primary-dark/25 bg-white/60 text-textSecondary hover:bg-white/90 hover:border-primary-dark/60")
                                    }
                                >
                                    {g.label}
                                </button>
                            );
                        })}
                    </div>
                    <FieldError message={fieldErrors.gender} />
                </div>

                <Field label="나이" error={fieldErrors.age}>
                    {(a11y) => (
                        <input
                            {...a11y}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={form.age}
                            onChange={(e) => update("age", e.target.value)}
                            className={INPUT_CLASS}
                        />
                    )}
                </Field>

                <FormMessages errorMessage={errorMessage} notice={notice} />

                <div className="flex justify-end">
                    <button type="submit" disabled={saving || !changed} className={SAVE_BUTTON_CLASS}>
                        {saving ? PROFILE_COPY.infoSaving : PROFILE_COPY.infoSave}
                    </button>
                </div>
            </form>
        </section>
    );
};

/* ② 비밀번호 변경 — 현재 비밀번호 + 새 비밀번호 + 확인. 현재 비밀번호가 틀려도 세션은 그대로(서버가 401을 주지 않는 계약) */
const PasswordCard = () => {
    const { handleApiError } = useApiError();
    const { notice, show, hide } = useNotice();

    const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    const update = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        setErrorMessage(null);
        hide();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving || !isPasswordFormFilled(form)) return;

        const errors = validatePasswordChange(form);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        setErrorMessage(null);
        try {
            await changeMyPassword(toPasswordPayload(form));
            setForm(EMPTY_PASSWORD_FORM);
            show(PROFILE_COPY.passwordSaved);
        } catch (err) {
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }
            const result = resolveSaveError(err, ["currentPassword", "newPassword"]);
            setFieldErrors(result.fieldErrors);
            setErrorMessage(result.message);
        } finally {
            setSaving(false);
        }
    };

    const passwordInput = (name, autoComplete) => (a11y) => (
        <input
            {...a11y}
            type="password"
            value={form[name]}
            onChange={(e) => update(name, e.target.value)}
            autoComplete={autoComplete}
            className={INPUT_CLASS}
        />
    );

    return (
        <section className={CARD_CLASS} aria-labelledby="profile-password-title">
            <h2 id="profile-password-title" className="text-lg font-semibold text-textPrimary mb-4">
                {PROFILE_COPY.passwordTitle}
            </h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Field label="지금 쓰는 비밀번호" error={fieldErrors.currentPassword}>
                    {passwordInput("currentPassword", "current-password")}
                </Field>
                <Field label="새 비밀번호" error={fieldErrors.newPassword}>
                    {passwordInput("newPassword", "new-password")}
                </Field>
                <Field label="새 비밀번호 확인" error={fieldErrors.newPasswordConfirm}>
                    {passwordInput("newPasswordConfirm", "new-password")}
                </Field>

                <FormMessages errorMessage={errorMessage} notice={notice} />

                <div className="flex justify-end">
                    <button type="submit" disabled={saving || !isPasswordFormFilled(form)} className={SAVE_BUTTON_CLASS}>
                        {saving ? PROFILE_COPY.passwordSaving : PROFILE_COPY.passwordSave}
                    </button>
                </div>
            </form>
        </section>
    );
};

const ProfileSettingsPage = () => {
    // Layout 로더(requireAuth)가 준 내 정보 — 저장 뒤 revalidate하면 새 값으로 바뀐다
    const me = useRouteLoaderData("layout");

    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-xl font-semibold text-textPrimary">{PROFILE_COPY.pageTitle}</h1>

                <CardMotion index={0}>
                    <InfoCard me={me} />
                </CardMotion>

                <CardMotion index={1}>
                    <PasswordCard />
                </CardMotion>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
