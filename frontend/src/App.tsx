function App() {
  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">Pharos Commerce</h1>
        <p className="text-lg text-secondary-500 mb-8">Your commerce platform is loading...</p>
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
