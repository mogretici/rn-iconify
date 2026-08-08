/**
 * K8s Icon Set
 * @see https://icon-sets.iconify.design/k8s/
 *
 * Auto-generated - do not edit manually
 */

import { createIconSet } from '../createIconSet';

const k8sIconNames = {
  'api-server': true,
  'cloud-controller-manager': true,
  clusterrole: true,
  clusterrolebinding: true,
  configmap: true,
  'controller-manager': true,
  cronjob: true,
  customresourcedefinition: true,
  daemonset: true,
  deployment: true,
  endpoints: true,
  'etcd-cluster': true,
  group: true,
  horizontalpodautoscaler: true,
  ingress: true,
  job: true,
  'kube-proxy': true,
  kubelet: true,
  limitrange: true,
  namespace: true,
  networkpolicy: true,
  persistentvolume: true,
  persistentvolumeclaim: true,
  pod: true,
  podsecuritypolicy: true,
  replicaset: true,
  resourcequota: true,
  role: true,
  rolebinding: true,
  scheduler: true,
  secret: true,
  service: true,
  serviceaccount: true,
  statefulset: true,
  storageclass: true,
  user: true,
  volume: true,
  'worker-node': true,
} as const;

export type K8sIconName = keyof typeof k8sIconNames;
export const K8s = createIconSet<K8sIconName>('k8s', k8sIconNames);
