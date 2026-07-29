<template>
  <SGSectionPanel
    section_id="selection_main_document"
    :title="$t('sg_selection_main_document')"
  >
    <SGSelectionMainDocumentField
      :selection_path="selection_folder_path"
      :selection_folder="selection"
      :can_edit="can_edit"
      @changed="$emit('changed')"
    />
  </SGSectionPanel>
</template>

<script>
import SGSectionPanel from "@/components/softgems/SGSectionPanel.vue";
import SGSelectionMainDocumentField from "@/components/selections/SGSelectionMainDocumentField.vue";

export default {
  name: "SGSelectionMainDocumentSection",
  components: {
    SGSectionPanel,
    SGSelectionMainDocumentField,
  },
  props: {
    selection_folder_path: {
      type: String,
      required: true,
    },
    selection: {
      type: Object,
      required: true,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
  },
};

</script>
