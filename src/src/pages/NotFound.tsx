import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404</h1>

      <p className="text-muted-foreground">
        Página no encontrada.
      </p>

      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Volver al inicio
      </Link>
    </div>
  );
}