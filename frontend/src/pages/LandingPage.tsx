
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const LandingPage =()=>{
  const navigate=useNavigate();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4"><span aria-hidden="true">🪄</span> Presto</h1>
        <p className="text-xl text-gray-600">
          A lightweight, enjoyable presentation tool
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => navigate('/login')}>
          Login
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/register')}
        >
          Register
        </Button>
      </div>
    </main>
  );
};

export default LandingPage