import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * AppTabs — sistema de abas padrão do Design System.
 * Substitui todos os TabsList customizados com border/borderRadius manuais.
 *
 * Usage:
 *   <AppTabs tabs={[{ value, label, icon: Icon }]} defaultValue="x">
 *     <AppTabPanel value="x">...</AppTabPanel>
 *   </AppTabs>
 */
export function AppTabPanel({ value, children }) {
  return <TabsContent value={value}>{children}</TabsContent>;
}

export default function AppTabs({ tabs = [], defaultValue, value, onValueChange, children }) {
  return (
    <Tabs defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <TabsList
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
          display: "flex",
          gap: 2,
          height: "auto",
        }}
      >
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            style={{
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-body)",
              padding: "7px 14px",
              color: "var(--text-secondary)",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
              flex: 1,
            }}
          >
            {t.icon && <t.icon style={{ width: 14, height: 14 }} />}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}