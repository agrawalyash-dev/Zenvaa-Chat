const Main = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  );
};

export default Main;
