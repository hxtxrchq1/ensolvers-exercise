interface FeedbackToastProps {
  message: string;
  type: 'success' | 'error';
}

export function FeedbackToast({ message, type }: FeedbackToastProps) {
  const isSuccess = type === 'success';

  return (
    <div
      className={[
        'fixed right-4 bottom-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-[0_12px_36px_rgba(38,48,35,0.14)] sm:right-6 sm:bottom-6',
        isSuccess
          ? 'border-[#dce4d5] bg-[#fbfcf8] text-[#40523b]'
          : 'border-[#eadbd2] bg-[#fffaf7] text-[#8e4d3e]',
      ].join(' ')}
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
    >
      <span
        className={[
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          isSuccess
            ? 'bg-[#e8eee1] text-[#58704f]'
            : 'bg-[#f5e9e1] text-[#a55343]',
        ].join(' ')}
      >
        {isSuccess ? (
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m5 12.5 4.5 4.5L19 7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.73 3h14.94a2 2 0 0 0 1.73-3L13.7 3.9a2 2 0 0 0-3.46 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        )}
      </span>
      <span>{message}</span>
    </div>
  );
}
