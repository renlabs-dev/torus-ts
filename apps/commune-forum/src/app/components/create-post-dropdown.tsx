"use client";
import React from 'react'
import { useState } from "react";
import { Dropdown } from "./dropdown";
import { Modal } from "./modal";
import { CreatePost } from "./create-post";
import type { Category } from './filters/categories-selector';
import { CreateExternalPost } from './create-external-post';
import { cairo } from '~/utils/fonts';
interface FiltersProps {
  categories: Category[];
}

export const CreatePostDropdown: React.FC<FiltersProps> = ({ categories, }) => {
  const [openModal, setOpenModal] = useState<"EXTERNAL" | "INTERNAL" | null>();

  const closeModal = () => {
    setOpenModal(null);
  };

  const dropdownActionsList = [
    {
      title: "Forum post",
      handle: () => setOpenModal("INTERNAL"),
    },
    {
      title: "External post",
      handle: () => setOpenModal("EXTERNAL"),
    },
  ];

  return (
    <div className={`ml-auto mb-4 sm:mb-0 w-full sm:w-fit hidden sm:block ${cairo.className}`}>
      <Dropdown actionsList={dropdownActionsList} title={"Create"} />
      <Modal
        title={openModal === "INTERNAL" ? "Create a forum post" : "Create an external post"}
        modalOpen={!!openModal}
        handleModal={closeModal}
      >
        {openModal === "INTERNAL" && <CreatePost categories={categories} handleModal={closeModal} />}
        {openModal === "EXTERNAL" && <CreateExternalPost categories={categories} handleModal={closeModal} />}
      </Modal>
    </div>
  );
}
