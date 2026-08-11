"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2, X } from "lucide-react";
import { statusOptions } from "@/lib/utils";
import {
  locationOptions,
  platformOptions,
  mergeWithDefaultOptions,
} from "@/components/ui/combobox-input";
import { getDistinctLocationsAndPlatforms } from "@/app/actions/applications";
import { useState, useEffect, useMemo } from "react";

export interface DetailEditFormData {
  role_name: string;
  company_name: string;
  location: string;
  salary: string;
  platform: string;
  link: string;
  date_applied: string;
  description: string;
  notes: string;
  status: string;
  statusCategory: string;
}



interface ApplicationDetailEditFormProps {
  editForm: DetailEditFormData;
  setEditForm: React.Dispatch<React.SetStateAction<DetailEditFormData>>;
  initialForm?: DetailEditFormData;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ApplicationDetailEditForm({
  editForm,
  setEditForm,
  initialForm,
  isSaving,
  onSave,
  onCancel,
}: ApplicationDetailEditFormProps) {
  const [userOptions, setUserOptions] = useState<{
    userLocations: string[];
    userPlatforms: string[];
  }>({
    userLocations: [],
    userPlatforms: [],
  });

  useEffect(() => {
    getDistinctLocationsAndPlatforms()
      .then((res) => {
        if (res) setUserOptions(res);
      })
      .catch(() => {});
  }, []);

  const mergedLocations = useMemo(
    () => mergeWithDefaultOptions(userOptions.userLocations, locationOptions),
    [userOptions.userLocations],
  );

  const mergedPlatforms = useMemo(
    () => mergeWithDefaultOptions(userOptions.userPlatforms, platformOptions),
    [userOptions.userPlatforms],
  );
  const isDirty = useMemo(() => {
    if (!initialForm) return true;
    const normalizeDate = (d?: string) => (d ? d.split("T")[0] : "");
    const normalizeText = (t?: string | null) => (t || "").trim();

    return (
      normalizeText(editForm.role_name) !==
        normalizeText(initialForm.role_name) ||
      normalizeText(editForm.company_name) !==
        normalizeText(initialForm.company_name) ||
      normalizeText(editForm.location) !==
        normalizeText(initialForm.location) ||
      normalizeText(editForm.salary) !== normalizeText(initialForm.salary) ||
      normalizeText(editForm.platform) !==
        normalizeText(initialForm.platform) ||
      normalizeText(editForm.link) !== normalizeText(initialForm.link) ||
      normalizeDate(editForm.date_applied) !==
        normalizeDate(initialForm.date_applied) ||
      normalizeText(editForm.description) !==
        normalizeText(initialForm.description) ||
      normalizeText(editForm.notes) !== normalizeText(initialForm.notes) ||
      normalizeText(editForm.status) !== normalizeText(initialForm.status) ||
      editForm.statusCategory !== initialForm.statusCategory
    );
  }, [editForm, initialForm]);
  return (
    <div className="space-y-4 text-sm opacity-100 transition-opacity duration-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="edit-status-category"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Status Category
          </label>
          <Select
            value={editForm.statusCategory}
            onValueChange={(val) =>
              setEditForm({ ...editForm, statusCategory: val })
            }
          >
            <SelectTrigger id="edit-status-category" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="capitalize"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="edit-status-detail"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Stage Details / Custom Status
          </label>
          <Input
            id="edit-status-detail"
            placeholder="e.g. Self-withdrawn, Post-tech screen"
            value={editForm.status}
            onChange={(e) =>
              setEditForm({ ...editForm, status: e.target.value })
            }
            className="h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="edit-platform"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Platform
          </label>
          {(() => {
            const val = editForm.platform || "";
            const isCustom =
              Boolean(val) &&
              !mergedPlatforms.some((opt) => opt.toLowerCase() === val.toLowerCase());
            const displayOptions = isCustom ? [val, ...mergedPlatforms] : mergedPlatforms;

            return (
              <Select
                value={val}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, platform: value })
                }
              >
                <SelectTrigger id="edit-platform" className="h-9">
                  <SelectValue placeholder="e.g. LinkedIn" />
                </SelectTrigger>
                <SelectContent>
                  {displayOptions.map((plat) => (
                    <SelectItem key={plat} value={plat}>
                      {plat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
        <div>
          <label
            htmlFor="edit-date-applied"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Date Applied
          </label>
          <Input
            id="edit-date-applied"
            type="date"
            value={
              editForm.date_applied ? editForm.date_applied.split("T")[0] : ""
            }
            onChange={(e) =>
              setEditForm({ ...editForm, date_applied: e.target.value })
            }
            className="h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="edit-location"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Location
          </label>
          {(() => {
            const val = editForm.location || "";
            const isCustom =
              Boolean(val) &&
              !mergedLocations.some((opt) => opt.toLowerCase() === val.toLowerCase());
            const displayOptions = isCustom ? [val, ...mergedLocations] : mergedLocations;

            return (
              <Select
                value={val}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, location: value })
                }
              >
                <SelectTrigger id="edit-location" className="h-9">
                  <SelectValue placeholder="e.g. Tel Aviv / Remote" />
                </SelectTrigger>
                <SelectContent>
                  {displayOptions.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
        <div>
          <label
            htmlFor="edit-salary"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Salary Range
          </label>
          <Input
            id="edit-salary"
            placeholder="e.g. 30k - 40k"
            value={editForm.salary}
            onChange={(e) =>
              setEditForm({ ...editForm, salary: e.target.value })
            }
            className="h-9"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="edit-link"
          className="text-[11px] font-semibold text-muted-foreground uppercase"
        >
          Job URL
        </label>
        <Input
          id="edit-link"
          placeholder="https://..."
          value={editForm.link}
          onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
          className="h-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="edit-description"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Job Description
          </label>
          <Textarea
            id="edit-description"
            rows={4}
            placeholder="Job posting responsibilities..."
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <label
            htmlFor="edit-notes"
            className="text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Personal Candidate Notes
          </label>
          <Textarea
            id="edit-notes"
            rows={4}
            placeholder="Recruiter contact, interview feedback..."
            value={editForm.notes}
            onChange={(e) =>
              setEditForm({ ...editForm, notes: e.target.value })
            }
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          className="flex-1 gap-2 font-medium"
          disabled={isSaving || !isDirty}
          onClick={onSave}
          title={!isDirty ? "No changes have been made" : undefined}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {!isDirty ? "No Changes" : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          disabled={isSaving}
          onClick={onCancel}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
