import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-brand-red mb-2">404</h1>
        <h2 className="text-xl font-semibold text-brand-white mb-4">
          Page Not Found
        </h2>
        <p className="text-text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-brand-red hover:bg-brand-red-light text-white font-medium rounded-lg transition-colors inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
