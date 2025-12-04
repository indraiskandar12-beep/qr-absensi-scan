import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Halaman tidak ditemukan</p>
        <Button onClick={() => navigate("/login")}>
          Kembali ke Login
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
