import { Button } from "@material-ui/core";

const StartButton = ({ children, color, ...rest }) => {
  return (
    <Button
      {...rest}
      style={{
        backgroundColor: "white",
        color: `${color}`,
        fontSize: "1.2rem",
        width: "10ch",
        transition: "2s",
        marginBottom: "5rem",
      }}
    >
      {children}
    </Button>
  );
};

export default StartButton;
