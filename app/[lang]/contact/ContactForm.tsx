"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { FaUser, FaEnvelope, FaBuilding, FaPhone } from "react-icons/fa";
import { motion } from "framer-motion";
import { useDictionary } from "@/hooks/use-dictionary";

export default function ContactForm() {
  const { dictionary: dict } = useDictionary();
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h2 className="text-xl font-semibold">{dict.contact.form.title}</h2>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Form className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                label={dict.contact.form.nameLabel}
                name="name"
                placeholder={dict.contact.form.namePlaceholder}
                startContent={<FaUser className="text-default-400" />}
                variant="bordered"
              />
              <Input
                isRequired
                label={dict.contact.form.companyLabel}
                name="company"
                placeholder={dict.contact.form.companyPlaceholder}
                startContent={<FaBuilding className="text-default-400" />}
                variant="bordered"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                label={dict.contact.form.emailLabel}
                name="email"
                placeholder={dict.contact.form.emailPlaceholder}
                startContent={<FaEnvelope className="text-default-400" />}
                type="email"
                variant="bordered"
              />
              <Input
                label={dict.contact.form.phoneLabel}
                name="phone"
                placeholder={dict.contact.form.phonePlaceholder}
                startContent={<FaPhone className="text-default-400" />}
                type="tel"
                variant="bordered"
              />
            </div>

            <Textarea
              isRequired
              label={dict.contact.form.messageLabel}
              minRows={4}
              name="message"
              placeholder={dict.contact.form.messagePlaceholder}
              variant="bordered"
            />

            <Button className="mt-2" color="primary" type="submit">
              {dict.contact.form.submit}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </motion.div>
  );
}
