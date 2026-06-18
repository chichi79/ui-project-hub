"use client";

import { useState } from "react";
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
  const [value, setValue] = useState(() => getUserName());

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
