import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  Box as BoxIcon,
  Camera as CameraIcon,
  Eye,
  EyeOff,
  Lightbulb as LightbulbIcon,
  Lock,
  Move3D,
  RotateCcw,
  Save,
  Scale,
  Settings,
  Trash2,
  Unlock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera } from "@react-three/drei";

type Vec3 = [number, number, number];

function toVec3(arr: number[] | undefined, fallback: Vec3): Vec3 {
  if (!arr || arr.length < 3) return fallback;
  return [arr[0] ?? fallback[0], arr[1] ?? fallback[1], arr[2] ?? fallback[2]];
}

function ModelObject({
  model,
  selected,
  onSelect,
}: {
  model: {
    _id: string;
    type: string;
    transform: { position: number[]; rotation: number[]; scale: number[] };
    geometry?: { type: string; parameters?: Record<string, any> };
    visible: boolean;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  if (!model.visible) return null;

  const position = toVec3(model.transform?.position, [0, 0, 0]);
  const rotation = toVec3(model.transform?.rotation, [0, 0, 0]);
  const scale = toVec3(model.transform?.scale, [1, 1, 1]);
  const color = selected ? "#3b82f6" : "#6b7280";

  if (model.type === "mesh") {
    const isBox = model.geometry?.type === "box";
    const w = model.geometry?.parameters?.width ?? 1;
    const h = model.geometry?.parameters?.height ?? 1;
    const d = model.geometry?.parameters?.depth ?? 1;

    return (
      <group position={position} rotation={rotation as any} scale={scale}>
        <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          {isBox ? <boxGeometry args={[w, h, d]} /> : <boxGeometry args={[1, 1, 1]} />}
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  if (model.type === "light") {
    return (
      <group position={position} rotation={rotation as any} scale={scale}>
        <pointLight intensity={1.2} />
        <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    );
  }

  if (model.type === "camera") {
    return (
      <group position={position} rotation={rotation as any} scale={scale}>
        <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <coneGeometry args={[0.2, 0.5, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  // Fallback
  return (
    <group position={position} rotation={rotation as any} scale={scale}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");

  const project = useQuery(
    api.projects.getById,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );
  const models = useQuery(
    api.projects.getModels,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const createModel = useMutation(api.models.create);
  const removeModel = useMutation(api.models.remove);
  const setVisibility = useMutation(api.models.setVisibility);

  const sortedModels = useMemo(() => (models ?? []).slice(), [models]);

  const handleAddModel = async (type: string) => {
    if (!projectId) return;

    try {
      await createModel({
        projectId: projectId as Id<"projects">,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now()}`,
        type,
        geometry: type === "mesh"
          ? {
              type: "box",
              parameters: { width: 1, height: 1, depth: 1 },
            }
          : undefined,
      });
      toast("Model added successfully");
    } catch {
      toast("Failed to add model");
    }
  };

  const handleDeleteModel = async () => {
    if (!selectedModel) return;

    try {
      await removeModel({ id: selectedModel as Id<"models"> });
      setSelectedModel(null);
      toast("Model deleted successfully");
    } catch {
      toast("Failed to delete model");
    }
  };

  if (!project || !models) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedModelData = models.find((m) => m._id === selectedModel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            ← Back
          </Button>
          <h1 className="font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar - Scene Hierarchy */}
        <div className="w-64 border-r bg-card">
          <div className="p-4">
            <h3 className="font-medium mb-4">Scene</h3>

            {/* Add Objects */}
            <div className="space-y-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleAddModel("mesh")}
              >
                <BoxIcon className="h-4 w-4 mr-2" />
                Add Mesh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleAddModel("light")}
              >
                <LightbulbIcon className="h-4 w-4 mr-2" />
                Add Light
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleAddModel("camera")}
              >
                <CameraIcon className="h-4 w-4 mr-2" />
                Add Camera
              </Button>
            </div>

            <Separator className="mb-4" />

            {/* Object List */}
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {sortedModels.map((model) => (
                  <div
                    key={model._id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedModel === model._id ? "bg-primary/10 border border-primary/20" : ""
                    }`}
                    onClick={() => setSelectedModel(model._id)}
                  >
                    {model.type === "mesh" && <BoxIcon className="h-4 w-4" />}
                    {model.type === "light" && <LightbulbIcon className="h-4 w-4" />}
                    {model.type === "camera" && <CameraIcon className="h-4 w-4" />}
                    <span className="text-sm flex-1 truncate">{model.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await setVisibility({
                            id: model._id as Id<"models">,
                            visible: !model.visible,
                          });
                        } catch {
                          toast("Failed to toggle visibility");
                        }
                      }}
                    >
                      {model.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b bg-card p-2 flex items-center gap-2">
            <Button
              variant={transformMode === "translate" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransformMode("translate")}
            >
              <Move3D className="h-4 w-4" />
            </Button>
            <Button
              variant={transformMode === "rotate" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransformMode("rotate")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant={transformMode === "scale" ? "default" : "outline"}
              size="sm"
              onClick={() => setTransformMode("scale")}
            >
              <Scale className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="outline" size="sm" disabled={!selectedModel} onClick={handleDeleteModel}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* 3D Viewport */}
          <div className="flex-1 bg-muted/20 relative">
            <Canvas
              onPointerMissed={() => setSelectedModel(null)}
              camera={{ position: [6, 6, 6], fov: 50 }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={0.7} />
              <PerspectiveCamera makeDefault position={[6, 6, 6]} />
              <Grid
                args={[30, 30]}
                cellSize={1}
                cellColor="#e5e7eb"
                sectionColor="#d1d5db"
                infiniteGrid
              />
              <OrbitControls makeDefault />
              {sortedModels.map((m) => (
                <ModelObject
                  key={m._id}
                  model={m as any}
                  selected={m._id === selectedModel}
                  onSelect={() => setSelectedModel(m._id)}
                />
              ))}
            </Canvas>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 border-l bg-card">
          <div className="p-4">
            <h3 className="font-medium mb-4">Properties</h3>

            {selectedModelData ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <Input value={selectedModelData.name} className="mt-1" readOnly />
                </div>

                <div>
                  <Label className="text-sm font-medium">Transform</Label>
                  <div className="mt-2 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <Input
                          placeholder="X"
                          value={selectedModelData.transform.position[0].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                        <Input
                          placeholder="Y"
                          value={selectedModelData.transform.position[1].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                        <Input
                          placeholder="Z"
                          value={selectedModelData.transform.position[2].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Rotation</Label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <Input
                          placeholder="X"
                          value={selectedModelData.transform.rotation[0].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                        <Input
                          placeholder="Y"
                          value={selectedModelData.transform.rotation[1].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                        <Input
                          placeholder="Z"
                          value={selectedModelData.transform.rotation[2].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Scale</Label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <Input
                          placeholder="X"
                          value={selectedModelData.transform.scale[0].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                        <Input
                          placeholder="Y"
                          value={selectedModelData.transform.scale[1].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                        <Input
                          placeholder="Z"
                          value={selectedModelData.transform.scale[2].toFixed(2)}
                          readOnly
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedModelData.type === "mesh" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Material</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Base Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 rounded border bg-gray-500"></div>
                          <span className="text-xs">#808080</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Metallic</Label>
                        <Slider value={[0.0]} max={1} step={0.01} className="mt-1" />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Roughness</Label>
                        <Slider value={[0.5]} max={1} step={0.01} className="mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    {selectedModelData.visible ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" /> Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" /> Hidden
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    {selectedModelData.locked ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" /> Locked
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 mr-1" /> Unlocked
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BoxIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select an object to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
