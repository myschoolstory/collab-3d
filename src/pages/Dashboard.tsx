import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Box, Folder, Plus, Settings, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const workspaces = useQuery(api.workspaces.getUserWorkspaces);
  const projects = useQuery(
    api.projects.getByWorkspace,
    selectedWorkspace ? { workspaceId: selectedWorkspace as any } : "skip"
  );

  const createWorkspace = useMutation(api.workspaces.create);
  const createProject = useMutation(api.projects.create);

  const handleCreateWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const workspaceId = await createWorkspace({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        isPublic: false,
      });
      setShowCreateWorkspace(false);
      setSelectedWorkspace(workspaceId);
      toast("Workspace created successfully");
    } catch (error) {
      toast("Failed to create workspace");
    }
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWorkspace) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      const projectId = await createProject({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        workspaceId: selectedWorkspace as any,
        isPublic: false,
      });
      setShowCreateProject(false);
      navigate(`/editor/${projectId}`);
      toast("Project created successfully");
    } catch (error) {
      toast("Failed to create project");
    }
  };

  if (!workspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate("/")}
            />
            <h1 className="text-xl font-bold tracking-tight">3D Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Workspaces Sidebar */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">Workspaces</h2>
              <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateWorkspace}>
                    <DialogHeader>
                      <DialogTitle>Create Workspace</DialogTitle>
                      <DialogDescription>
                        Create a new workspace to organize your 3D projects.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="My Workspace"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Workspace</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {workspaces.filter(Boolean).map((workspace) => (
                <Card
                  key={workspace!._id}
                  className={`cursor-pointer transition-colors ${
                    selectedWorkspace === workspace!._id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedWorkspace(workspace!._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{workspace!.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {workspace!.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="lg:col-span-3">
            {selectedWorkspace ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold tracking-tight">Projects</h2>
                  <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreateProject}>
                        <DialogHeader>
                          <DialogTitle>Create 3D Project</DialogTitle>
                          <DialogDescription>
                            Start a new 3D modeling project in this workspace.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="project-name">Name</Label>
                            <Input
                              id="project-name"
                              name="name"
                              placeholder="My 3D Model"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="project-description">Description</Label>
                            <Textarea
                              id="project-description"
                              name="description"
                              placeholder="Optional description"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Project</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {projects && projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <motion.div
                        key={project._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <div
                              className="aspect-video bg-muted flex items-center justify-center rounded-t-lg"
                              onClick={() => navigate(`/editor/${project._id}`)}
                            >
                              <Box className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium mb-1">{project.name}</h3>
                              {project.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  Modified {new Date(project.lastModified).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <Settings className="h-3 w-3" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first 3D project to get started.
                    </p>
                    <Button onClick={() => setShowCreateProject(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a workspace</h3>
                <p className="text-muted-foreground">
                  Choose a workspace from the sidebar to view its projects.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
