import React from "react";
import { Form as AntForm } from "antd";
import type { FormProps as AntFormProps } from "antd";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const formVariants = cva("", {
  variants: {
    layoutType: {
      default: "",
      compact:
        "[&_.ant-form-item-label]:!pb-1.5 [&_.ant-form-item-label>label]:!h-auto [&_.ant-form-item-label>label]:!min-h-0 [&_.ant-form-item-label>label]:!leading-normal",
    },
  },
  defaultVariants: {
    layoutType: "default",
  },
});

export interface FormProps<Values = unknown>
  extends AntFormProps<Values>,
    VariantProps<typeof formVariants> {}

type AntFormComponent = typeof AntForm;
type FormRef = React.ElementRef<AntFormComponent>;
type FormStaticMembers = Pick<
  AntFormComponent,
  | "Item"
  | "List"
  | "Provider"
  | "useForm"
  | "useFormInstance"
  | "useWatch"
>;
type FormComponentType = (<Values = unknown>(
  props: FormProps<Values> & React.RefAttributes<FormRef>,
) => React.ReactElement) &
  FormStaticMembers;
type AntFormRenderable = React.ComponentType<
  AntFormProps<unknown> & React.RefAttributes<FormRef>
>;

const FormComponent = <Values = unknown,>(
  { layoutType, className, ...props }: FormProps<Values>,
  ref: React.ForwardedRef<FormRef>,
) => {
  const formProps = {
    ...props,
    ref,
    className: cn(formVariants({ layoutType }), className),
  } as AntFormProps<unknown> & React.RefAttributes<FormRef>;

  return React.createElement(AntForm as AntFormRenderable, formProps);
};

export const Form = React.forwardRef(FormComponent) as unknown as FormComponentType;

Object.assign(Form, {
  Item: AntForm.Item,
  List: AntForm.List,
  Provider: AntForm.Provider,
  displayName: "Form",
  useForm: AntForm.useForm,
  useFormInstance: AntForm.useFormInstance,
  useWatch: AntForm.useWatch,
});

export const useForm = AntForm.useForm;
export const useWatch = AntForm.useWatch;
