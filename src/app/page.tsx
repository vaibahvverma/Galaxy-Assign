import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import WorkflowCanvas from "@/components/canvas/WorkflowCanvas";
import WorkflowToolbar from "@/components/layout/WorkflowToolbar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden relative">
      <LeftSidebar />

      <main className="flex-1 relative">
        {/* Toolbar and UserButton (client component) */}
        <WorkflowToolbar />

        {/* Canvas */}
        <div className="absolute inset-0 z-0">
          <WorkflowCanvas />
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
