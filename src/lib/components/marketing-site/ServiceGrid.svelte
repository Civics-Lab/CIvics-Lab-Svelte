<script lang="ts">
    export let id = '';
    export let heading = '';
    export let services = [];
    export let variant = undefined;
    
    import DetailCard from './DetailCard.svelte';
  </script>
  
  <section {id} class="mx-auto px-4 py-12 md:py-20">
    <div class="max-w-7xl mx-auto w-full flex flex-col gap-8">
      <h2 class="text-4xl font-bold">{heading}</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each services as service, index}
          <DetailCard
            icon={service.icon}
            text={service.text}
            heading={service.heading}
            body={service.body}
            variant={variant || service.variant}
          />
        {/each}
      </div>
    </div>
  </section>