<script lang="ts">
  import { FieldGroup } from '@bigmarket/bm-ui';
  import { FormSectionContainer } from '@bigmarket/bm-ui';
  import { InputField } from '@bigmarket/bm-ui';
  import { SubmitButton } from '@bigmarket/bm-ui';
  import { TextAreaField } from '@bigmarket/bm-ui';
  import { ParaContainer } from '@bigmarket/bm-ui';
  import { onMount } from 'svelte';

  const { onPromptMarket } = $props<{
		onPromptMarket: (data: any) => void;
	}>();


  let source: string | undefined = $state(undefined);
  let suggestion: string | undefined = $state(undefined);

  const prompt = async (mechanism: number) => {
    await onPromptMarket({ mechanism, source, suggestion });
  };

  onMount(async () => {});
</script>

<FormSectionContainer title={'Generate New Market'}>
  <FieldGroup>
    <ParaContainer
      >Either, enter the url of a news story you want to create a market for.</ParaContainer
    >
    <InputField
      id="discovery-source"
      label="Source (URL)"
      placeholder="https://example.com"
      bind:value={source}
    />
    <SubmitButton onClick={() => prompt(2)}>Generate Market</SubmitButton>
  </FieldGroup>
  <FieldGroup>
    <ParaContainer>Or, enter a suggestion you want to create a market for.</ParaContainer>
    <TextAreaField
      id="market-criteria"
      label="Resolution Criteria"
      placeholder="Describe how this market should be resolved..."
      bind:value={suggestion}
    />
    <SubmitButton fullWidth={false} onClick={() => prompt(1)}>Generate Market</SubmitButton>
  </FieldGroup>
</FormSectionContainer>
