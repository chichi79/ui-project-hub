"use client";

import { useEffect, useState } from "react";
import { getUserName } from "@/lib/user";

interface AuthorInputProps {
  name?: string;
  className?: string;
  placeholder?: string;
}

export default function AuthorInput({
  name = "author",
  className = "input-field",
  placeholder = "이름",
}: AuthorInputProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const saved = getUserName();
    if (saved) setValue(saved);
  }, []);

  return (
    <input
      name={name}
      required
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={className}
      placeholder={placeholder}
    />
  );
}
