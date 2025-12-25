"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

const initialState: ConfirmState = {
  isOpen: false,
  options: {
    title: "确认",
    description: "",
    confirmText: "确定",
    cancelText: "取消",
    variant: "default",
  },
  resolve: null,
}

/**
 * Promise-based 确认对话框 Hook
 *
 * 使用示例:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirm()
 *
 * // 在组件中渲染 ConfirmDialog
 * return (
 *   <>
 *     <ConfirmDialog />
 *     <button onClick={async () => {
 *       const confirmed = await confirm({
 *         description: '确定要删除此项吗？'
 *       })
 *       if (confirmed) {
 *         // 执行删除操作
 *       }
 *     }}>删除</button>
 *   </>
 * )
 * ```
 */
export function useConfirm() {
  const [state, setState] = React.useState<ConfirmState>(initialState)

  const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options: {
          title: options.title ?? "确认",
          description: options.description,
          confirmText: options.confirmText ?? "确定",
          cancelText: options.cancelText ?? "取消",
          variant: options.variant ?? "default",
        },
        resolve,
      })
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true)
    setState(initialState)
  }, [state.resolve])

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false)
    setState(initialState)
  }, [state.resolve])

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      handleCancel()
    }
  }, [handleCancel])

  const ConfirmDialog = React.useCallback(() => {
    return (
      <AlertDialog open={state.isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.options.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {state.options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {state.options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                state.options.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {state.options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }, [state, handleOpenChange, handleCancel, handleConfirm])

  return {
    confirm,
    ConfirmDialog,
  }
}
