"use client";

import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
} from "react";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorStateCtx,
  serializerCtx,
} from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { nord } from "@milkdown/theme-nord";

export interface MilkdownEditorRef {
  getMarkdown: () => string;
}

interface MilkdownEditorProps {
  value: string;
  onChange?: (markdown: string) => void;
}

function MilkdownInner({
  value,
  onChange,
  editorRef,
}: {
  value: string;
  onChange?: (markdown: string) => void;
  editorRef: React.MutableRefObject<(() => string) | null>;
}) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const { get } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, value);
      })
      .use(commonmark)
      .config(nord);
  }, []);

  const getMarkdown = useCallback((): string => {
    const editor = get();
    if (!editor) return value;
    try {
      return editor.action((ctx) => {
        const serializer = ctx.get(serializerCtx);
        const doc = ctx.get(editorStateCtx).doc;
        return serializer(doc);
      });
    } catch {
      return value;
    }
  }, [get, value]);

  useImperativeHandle(editorRef, () => getMarkdown, [getMarkdown]);

  return (
    <div className="milkdown-editor-wrapper w-full min-h-[200px]">
      <Milkdown />
    </div>
  );
}

export const MilkdownEditor = forwardRef<
  MilkdownEditorRef,
  MilkdownEditorProps
>(function MilkdownEditor({ value, onChange }, ref) {
  const getMarkdownRef = useRef<(() => string) | null>(null);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      if (getMarkdownRef.current) {
        return getMarkdownRef.current();
      }
      return value;
    },
  }), [value]);

  return (
    <MilkdownProvider>
      <MilkdownInner
        value={value}
        onChange={onChange}
        editorRef={getMarkdownRef}
      />
    </MilkdownProvider>
  );
});
