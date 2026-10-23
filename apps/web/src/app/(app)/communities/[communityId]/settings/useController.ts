import {
  type CommunityDetail,
  type CommunityDetailsInput,
  communityDetailsSchema,
} from "@hallway/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { type FieldErrors, parseForm } from "@/lib/form";
import { client, orpc } from "@/lib/orpc";

interface ControllerProps {
  /** The community as loaded on the server. */
  community: CommunityDetail;
}

export function useController({ community: initial }: ControllerProps) {
  const communityId = initial.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<CommunityDetailsInput>>({});
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const community = useQuery(
    orpc.communities.get.queryOptions({
      input: { communityId },
      initialData: initial,
    }),
  ).data;
  const can = (action: CommunityDetail["actions"][number]) =>
    community.actions.includes(action);

  const update = useMutation({
    ...orpc.communities.update.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.communities.get.key({ input: { communityId } }),
      });
      toast.success("Zapisano zmiany");
      // The header and the dashboard are rendered on the server with the old name
      router.refresh();
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      communityDetailsSchema,
      event.currentTarget,
    );
    setErrors(errors ?? {});
    if (data) update.mutate({ communityId, ...data });
  }

  /**
   * Hides the community, then leaves for the dashboard, or for the first steps when the
   * user no longer belongs anywhere.
   */
  const remove = useMutation({
    mutationFn: async () => {
      await client.communities.remove({ communityId });
      return client.me.get();
    },
    onSuccess: (me) => {
      // The page still watches the community; refetching it now would only get a 404
      void queryClient.invalidateQueries({
        queryKey: orpc.me.key(),
        refetchType: "none",
      });
      toast.success(`Usunięto wspólnotę ${community.name}`);
      const belongsSomewhere = me.communities.length > 0 || me.units.length > 0;
      router.push(belongsSomewhere ? "/" : "/welcome");
      router.refresh();
    },
  });

  function openDelete() {
    setConfirmation("");
    remove.reset();
    setDeleteOpen(true);
  }

  return {
    community,
    canUpdate: can("community.update"),
    canDelete: can("community.delete"),
    errors,
    formError: update.error?.message,
    isPending: update.isPending,
    onSubmit,
    deletion: {
      isOpen: isDeleteOpen,
      open: openDelete,
      close: () => setDeleteOpen(false),
      confirmation,
      setConfirmation,
      // The name typed exactly as it is, so a community isn't deleted by accident
      canConfirm: confirmation === community.name && !remove.isPending,
      confirm: () => remove.mutate(),
      formError: remove.error?.message,
    },
  };
}
