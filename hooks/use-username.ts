import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const ANIMALS = [
  "wolf",
  "hawk",
  "tiger",
  "eagle",
  "lion",
  "panther",
  "fox",
  "bear",
  "leopard",
  "lynx",
];
const STORAGE_KEY = "chat-username";

const generateRandomUsername = () => {
  const word1 = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `anonymous-${word1}-${nanoid(5)}`;
};
export const useUsername = () => {
  const [username, setUsername] = useState("");

  const updateUsername = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem(STORAGE_KEY, newUsername);
  };

  useEffect(() => {
    const main = () => {
      const storedUsername = localStorage.getItem(STORAGE_KEY);
      if (storedUsername) {
        setUsername(storedUsername);
        return;
      }
      const generatedUsername = generateRandomUsername();
      localStorage.setItem(STORAGE_KEY, generatedUsername);
      setUsername(generatedUsername);
    };
    main();
  }, []);

  return { username, updateUsername };
};