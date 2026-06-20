"use client";

interface GlobalErrorProps {
error: Error & {
digest?: string;
};
reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}:GlobalErrorProps) {

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>

      <button
        onClick={() => reset()}
        style={{ marginTop: 20, padding: "8px 16px" }}
      >
        Try again
      </button>
    </div>
  );
}