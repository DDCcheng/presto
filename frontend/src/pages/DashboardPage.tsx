import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { getStore as getStoreApi,updateStore as updateStoreApi, logout as logoutApi } from "../services/api";
import type{ Presentation } from "../types";
import { useEffect,useState } from "react";
import ErrorPopup from "../components/common/ErrorPopup";
import NewPresentation from "@/components/common/NewPresentationModal";
import { isBlank, normalizeInput } from "../lib/utils";

const DashboardPage=()=>{
  const {logout,token}=useAuth();
  const navigate=useNavigate();
  const [error, setError] = useState<string | null    >(null);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [creatingPresentation, setCreatingPresentation] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(()=>{
    const getStore= async()=>{
      if (!token) return;
      try {
        const data=await getStoreApi(token);
        setPresentations(data.store.presentations || []);
      }catch(error){
        setError( error instanceof Error ? error.message : ' Failed to load presentations');
      }
    };
    getStore();
  },[token]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      if (token) {
        await logoutApi(token);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log out');
    } finally {
      logout();
      navigate('/');
      setLoggingOut(false);
    }
  };
  const newPresentation=()=>{
    setError(null);
    setShowModal(true);
  }
  const handleCreatePresentation=async(name:string,description:string,thumbnail:string)=>{
    if (!token || creatingPresentation) return;
    const trimmedName = normalizeInput(name);
    const trimmedDescription = normalizeInput(description);
    const trimmedThumbnail = normalizeInput(thumbnail);

    if (isBlank(trimmedName) || isBlank(trimmedDescription) || isBlank(trimmedThumbnail)) {
      setError('Name, description, and thumbnail cannot be blank');
      return;
    }

    setCreatingPresentation(true);
    try {
      const data = await getStoreApi(token);
      const createdPresentation :Presentation={
        id:crypto.randomUUID(),
        name:trimmedName,
        description:trimmedDescription,
        thumbnail:trimmedThumbnail,
        slides:[{
          id: crypto.randomUUID(),
          elements: [],
          background: '',
          transition:'none',
        }]
      };
      const updatePresentation=[...(data.store.presentations || []), createdPresentation];

      await updateStoreApi(token,{presentations:updatePresentation});
      setPresentations(updatePresentation);
      setShowModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create presentation');
    } finally {
      setCreatingPresentation(false);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={newPresentation} disabled={creatingPresentation}>
                     New Presentation
        </Button>
        <Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
                    {loggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
      {error && (
        <ErrorPopup message={error} onClose={() => setError(null)} />
      )}
      {showModal && (
        <NewPresentation
          onClose={() => setShowModal(false)}
          onSubmit={handleCreatePresentation}
          submitting={creatingPresentation}
        />
      )}
      <div className="grid gap-4 mt-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {presentations.map((presentation) => (
          <div key={presentation.id} 
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
            onClick={() => navigate(`/presentation/${presentation.id}`)}>
            <div className="aspect-2/1 bg-gray-200">
              {presentation.thumbnail && (
                <img src={presentation.thumbnail} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold">Name: {presentation.name}</p>
              {presentation.description && (
                <p className="text-sm text-gray-500">Description: {presentation.description}</p>
              )}
              <p className="text-sm text-gray-400">{presentation.slides.length} slides</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage;
