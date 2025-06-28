"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: "pending" | "testing" | "success" | "error";
  error?: string;
}

interface PlatformTestCardProps {
  title: string;
  testItems: TestItem[];
  onRunTest: (testId: string) => void;
}

export default function PlatformTestCard({
  title,
  testItems,
  onRunTest,
}: PlatformTestCardProps) {
  const getStatusIcon = (status: TestItem["status"]) => {
    switch (status) {
      case "success":
        return <FiCheckCircle className="text-green-500" size={20} />;
      case "error":
        return <FiXCircle className="text-red-500" size={20} />;
      case "testing":
        return <FiLoader className="text-blue-500 animate-spin" size={20} />;
      default:
        return null;
    }
  };

  const getStatusChip = (status: TestItem["status"]) => {
    switch (status) {
      case "success":
        return (
          <Chip color="success" size="sm" variant="flat">
            성공
          </Chip>
        );
      case "error":
        return (
          <Chip color="danger" size="sm" variant="flat">
            실패
          </Chip>
        );
      case "testing":
        return (
          <Chip color="primary" size="sm" variant="flat">
            테스트 중
          </Chip>
        );
      default:
        return (
          <Chip color="default" size="sm" variant="flat">
            대기
          </Chip>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        {testItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(item.status)}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
                {item.error && (
                  <p className="text-sm text-red-600 mt-1">{item.error}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusChip(item.status)}
              <Button
                color="primary"
                isDisabled={item.status === "testing"}
                size="sm"
                variant="flat"
                onPress={() => onRunTest(item.id)}
              >
                {item.status === "testing" ? "테스트 중..." : "테스트"}
              </Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
