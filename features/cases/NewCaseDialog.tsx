"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { casesApi } from "@/services";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

const schema = z.object({
  paymentId: z.string().min(3, "Payment ID required").max(64).regex(/^[\w-]+$/, "Letters, numbers, _ and - only"),
  customerEmail: z.string().email("Invalid email").or(z.literal("")),
  channel: z.enum(["whatsapp", "email", "freshdesk", "api", "manual"]),
  customerMessage: z.string().max(4000),
});
type F = z.infer<typeof schema>;

export function NewCaseDialog({ defaultOpen }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { channel: "api", paymentId: "", customerEmail: "", customerMessage: "" } });
  const m = useMutation({
    mutationFn: (v: F) => casesApi.create({ paymentId: v.paymentId, channel: v.channel, ...(v.customerEmail && { customerEmail: v.customerEmail }), ...(v.customerMessage && { customerMessage: v.customerMessage }) }),
    onSuccess: (c) => { toast.push({ kind: "info", title: `Case ${c.caseNumber} created`, body: "Rhea has been queued to investigate." }); void qc.invalidateQueries({ queryKey: ["cases"] }); reset(); setOpen(false); router.push(`/cases/${c._id}`); },
    onError: (e: Error) => toast.push({ kind: "error", title: "Could not create case", body: e.message }),
  });
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New case</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Create case"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={m.isPending} onClick={handleSubmit((v) => m.mutate(v))}>Create & investigate</Button></>}>
        <form className="space-y-4" onSubmit={handleSubmit((v) => m.mutate(v))} noValidate>
          <Field label="Payment ID" htmlFor="paymentId" error={errors.paymentId?.message}><Input id="paymentId" placeholder="pay_Q7xK2" {...register("paymentId")} /></Field>
          <Field label="Customer email (optional)" htmlFor="customerEmail" error={errors.customerEmail?.message}><Input id="customerEmail" type="email" {...register("customerEmail")} /></Field>
          <Field label="Channel" htmlFor="channel"><Select id="channel" {...register("channel")}>{["api", "whatsapp", "email", "freshdesk", "manual"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Customer message (treated as untrusted data)" htmlFor="msg" error={errors.customerMessage?.message}><Textarea id="msg" {...register("customerMessage")} /></Field>
        </form>
      </Dialog>
    </>
  );
}
