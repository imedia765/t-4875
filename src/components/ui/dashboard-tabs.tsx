import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const DashboardTabs = TabsPrimitive.Root;

const DashboardTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "w-full bg-dashboard-card border-b border-dashboard-cardBorder p-1",
      className
    )}
    {...props}
  />
));
DashboardTabsList.displayName = TabsPrimitive.List.displayName;

const DashboardTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex-1 px-3 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-dashboard-accent1 data-[state=active]:text-white rounded-lg mx-1",
      className
    )}
    {...props}
  />
));
DashboardTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const DashboardTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
DashboardTabsContent.displayName = TabsPrimitive.Content.displayName;

export { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent };