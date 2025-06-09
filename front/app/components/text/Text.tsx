import React, { ReactNode } from "react";

interface HeadingProps {
  children: ReactNode;
  type?: "title" | "subtitle" | "error" | "alert";
  color?: string; // Clase personalizada opcional
}

const Heading: React.FC<HeadingProps> = ({
  children,
  type = "title",
  color,
}) => {
  let headingElement;
  let underlineStyle =
    "border-gray-400 w-full sm:max-w-[260px] mx-auto mb-2 hover:border-blue-500 transition-colors duration-200";

  const getTextClass = (defaultClass: string) =>
    color ? `${defaultClass} ${color}` : defaultClass;

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

  return (
    <div className="text-center w-full">
      {headingElement}
      <hr className={`mt-2 ${underlineStyle}`} />
    </div>
  );
};

export default Heading;
