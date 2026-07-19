const Fotter = () => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        backgroundColor: "#F5F5F5",
        color: "#111",
        padding: "10px 0",
        textAlign: "center",
        zIndex: 1000
      }}
    >
      <p style={{ fontSize: "12px", margin: 0, opacity: 0.8 }}>
        Developed by: Athiya Tabassum
      </p>
    </div>
  );
};

export default Fotter;
