"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { FaUser, FaEnvelope, FaBuilding, FaPhone } from "react-icons/fa";
import { motion } from "framer-motion";

import { title } from "@/components/primitives";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-20">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className="flex flex-col gap-1 px-6 pt-6">
            <h1 className={title({ size: "sm" })}>영업팀 문의</h1>
            <p className="text-sm text-default-500">
              엔터프라이즈 솔루션에 대해 문의하시면 영업팀이 연락드리겠습니다.
            </p>
          </CardHeader>
          <CardBody className="px-6 py-4">
            <Form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="이름"
                  name="name"
                  placeholder="홍길동"
                  startContent={<FaUser className="text-default-400" />}
                  variant="bordered"
                />
                <Input
                  isRequired
                  label="회사명"
                  name="company"
                  placeholder="회사명을 입력하세요"
                  startContent={<FaBuilding className="text-default-400" />}
                  variant="bordered"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="이메일"
                  name="email"
                  placeholder="your@company.com"
                  startContent={<FaEnvelope className="text-default-400" />}
                  type="email"
                  variant="bordered"
                />
                <Input
                  label="전화번호"
                  name="phone"
                  placeholder="010-1234-5678"
                  startContent={<FaPhone className="text-default-400" />}
                  type="tel"
                  variant="bordered"
                />
              </div>

              <Textarea
                isRequired
                label="문의 내용"
                minRows={4}
                name="message"
                placeholder="어떤 도움이 필요하신지 자세히 알려주세요"
                variant="bordered"
              />

              <Button className="mt-2" color="primary" type="submit">
                문의하기
              </Button>
            </Form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
