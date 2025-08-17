"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { motion, useReducedMotion } from "framer-motion";

import { modalContent } from "@/utils/animations";

interface AnimatedModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode | ((onClose: () => void) => React.ReactNode);
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  placement?:
    | "auto"
    | "center"
    | "top"
    | "top-center"
    | "bottom"
    | "bottom-center";
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  backdrop?: "blur" | "transparent" | "opaque";
}

export function AnimatedModal({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  size = "md",
  placement = "center",
  isDismissable = true,
  hideCloseButton = false,
  backdrop = "blur",
}: AnimatedModalProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <Modal
      backdrop={backdrop}
      hideCloseButton={hideCloseButton}
      isDismissable={isDismissable}
      isOpen={isOpen}
      motionProps={
        prefersReducedMotion
          ? undefined
          : {
              variants: {
                enter: modalContent.animate,
                exit: modalContent.exit,
              },
            }
      }
      placement={placement}
      size={size}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {title && (
              <ModalHeader>
                {prefersReducedMotion ? (
                  <div>{title}</div>
                ) : (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.1 }}
                  >
                    {title}
                  </motion.div>
                )}
              </ModalHeader>
            )}
            <ModalBody>
              {prefersReducedMotion ? (
                <div>{children}</div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.2 }}
                >
                  {children}
                </motion.div>
              )}
            </ModalBody>
            {footer && (
              <ModalFooter>
                {prefersReducedMotion ? (
                  <div className="flex gap-2">
                    {typeof footer === "function" ? footer(onClose) : footer}
                  </div>
                ) : (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.3 }}
                  >
                    {typeof footer === "function" ? footer(onClose) : footer}
                  </motion.div>
                )}
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
