import { Button } from "@material-ui/core";
const BackButton = ({ children, color, ...rest }) => {
  return (
    <Button
      {...rest}
      style={{
        backgroundColor: "white",
        color: `${color}`,
        fontSize: "1rem",
        width: "10ch",
        transition: "2s",
      }}
    >
      {children}
    </Button>
  );
};

export default BackButton;
