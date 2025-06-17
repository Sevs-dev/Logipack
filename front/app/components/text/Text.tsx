import React, { ReactNode } from "react";

interface HeadingProps {
  children: ReactNode;
  type?: "title" | "subtitle" | "error" | "alert";
  color?: string; 
}

const Heading: React.FC<HeadingProps> = ({
  children,
  type = "title",
  color,
}) => {
  let headingElement;

  const getTextClass = (defaultClass: string) =>
    color ? `${defaultClass} ${color}` : defaultClass;

  const getBorderColor = () => {
    if (color?.startsWith("text-")) {
      return color.replace("text-", "border-");
    } else if (color?.startsWith("#") || color?.startsWith("rgb")) {
      return color;
    } else {
      return "border-black"; // ahora sí: si es title por defecto → negro
    }
  };

  switch (type) {
    case "title":
      headingElement = (
        <h1 className={getTextClass("text-2xl font-bold text-black")}>
          {children}
        </h1>
      );
      break;
    case "subtitle":
      headingElement = (
        <h2 className={getTextClass("text-sm font-semibold text-gray-700")}>
          {children}
        </h2>
      );
      break;
    case "error":
      headingElement = (
        <h3 className={getTextClass("text-sm font-semibold text-red-700")}>
          {children}
        </h3>
      );
      break;
    case "alert":
      headingElement = (
        <h3 className={getTextClass("text-sm font-semibold text-[#ffb428]")}>
          {children}
        </h3>
      );
      break;
    default:
      headingElement = (
        <h1 className={getTextClass("text-2xl font-bold text-black")}>
          {children}
        </h1>
      );
  }

  const borderColor = getBorderColor();

  return (
    <div className="text-center w-full">
      {headingElement}
      {
        borderColor.startsWith("#") || borderColor.startsWith("rgb") ? (
          <hr
            className={`mt-2 w-full sm:max-w-[260px] mx-auto mb-2 transition-colors duration-200`}
            style={{ borderColor }}
          />
        ) : (
          <hr
            className={`mt-2 w-full sm:max-w-[260px] mx-auto mb-2 transition-colors duration-200 border ${borderColor}`}
          />
        )
      }
    </div>
  );
};

export default Heading;
