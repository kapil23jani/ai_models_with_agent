import React from "react";

function Avatar({ gender }) {
  const avatarUrl =
    gender === "male"
      ? "https://randomuser.me/api/portraits/men/32.jpg"
      : "https://randomuser.me/api/portraits/women/32.jpg";
  return (
    <img
      src={avatarUrl}
      alt={`${gender} avatar`}
      className="w-20 h-20 rounded-full border-4 border-blue-400 shadow-md"
    />
  );
}

export default Avatar;