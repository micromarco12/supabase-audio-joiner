import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { url1, url2, outputName } = await req.json();

  if (!url1 || !url2 || !outputName) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    const [res1, res2] = await Promise.all([fetch(url1), fetch(url2)]);
    const [buffer1, buffer2] = await Promise.all([
      res1.arrayBuffer(),
      res2.arrayBuffer(),
    ]);

    const mergedBuffer = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    mergedBuffer.set(new Uint8Array(buffer1), 0);
    mergedBuffer.set(new Uint8Array(buffer2), new Uint8Array(buffer1).length);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { error } = await supabase.storage
      .from("audio-merges")
      .upload(outputName, mergedBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const publicUrl = `${Deno.env.get("SUPABASE_URL")!.replace(
      ".supabase.co",
      ".supabasecdn.com"
    )}/storage/v1/object/public/audio-merges/${outputName}`;

    return new Response(JSON.stringify({ mergedUrl: publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Merge failed", detail: err.message }), {
      status: 500,
// Trigger redeploy
// trigger action
      // trigger action
    });
  }
});
