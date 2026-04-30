import { createEtcdProvider } from "./etcd-provider";

const ETCD_ENDPOINT = process.env.ETCD_ENDPOINT;

// Skip unless ETCD_ENDPOINT is set (e.g. in CI with a real etcd instance)
const describeIf = ETCD_ENDPOINT ? describe : describe.skip;

describeIf("EtcdProvider integration", () => {
  it("connects to real etcd and loads keys", async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Etcd3 } = require("etcd3");
    const client = new Etcd3({ hosts: ETCD_ENDPOINT });

    // Seed a test key
    await client.put("/driftcheck-test/INTEGRATION_KEY").value("hello");

    const provider = createEtcdProvider(client, {
      prefix: "/driftcheck-test/",
    });

    const result = await provider.load();
    expect(result["INTEGRATION_KEY"]).toBe("hello");

    // Cleanup
    await client.delete().key("/driftcheck-test/INTEGRATION_KEY");
    client.close();
  });
});
